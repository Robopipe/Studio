import { BadRequestException, NotFoundException } from "@nestjs/common";
import { TaskFileTypeEnum, TaskStatusEnum } from "@repo/schema";
import { TaskService } from "./task.service";

const ORG_ID = 10;
const USER_ID = 7;
const TARGET_PROJECT = 1;
const SOURCE_PROJECT = 2;

const publicUrl = (path: string) => `https://storage.googleapis.com/bucket/${path}`;

const sourceTask = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  projectId: SOURCE_PROJECT,
  filePath: publicUrl(`${SOURCE_PROJECT}/assets/uuid_image-${id}.jpeg`),
  thumbnailUrl: publicUrl(`${SOURCE_PROJECT}/thumbnails/uuid_${id}.webp`),
  width: 640,
  height: 480,
  ...overrides,
});

const uniqueViolation = (constraint: string) =>
  Object.assign(new Error("duplicate key value"), { code: "23505", constraint });

describe("TaskService.importTasks", () => {
  let assetsService: {
    getAssetName: jest.Mock;
    copyFile: jest.Mock;
    deleteFile: jest.Mock;
    getPublicUrl: jest.Mock;
  };
  let taskRepository: {
    getAllByIdsAndProjectId: jest.Mock;
    createWithNextIid: jest.Mock;
  };
  let projectRepository: { getById: jest.Mock };
  let service: TaskService;

  const importTasks = (taskIds: number[], sourceProjectId = SOURCE_PROJECT) =>
    service.importTasks(TARGET_PROJECT, { sourceProjectId, taskIds }, USER_ID, ORG_ID);

  beforeEach(() => {
    assetsService = {
      getAssetName: jest.fn((fileName: string, projectId: number, type: string) =>
        type === "thumbnail"
          ? `${projectId}/thumbnails/uuid_${fileName.replace(/\.[^.]+$/, "")}.webp`
          : `${projectId}/assets/uuid_${fileName}`,
      ),
      copyFile: jest.fn((_source: string, dest: string) => Promise.resolve(publicUrl(dest))),
      deleteFile: jest.fn(() => Promise.resolve()),
      getPublicUrl: jest.fn((path: string) => publicUrl(path)),
    };
    taskRepository = {
      getAllByIdsAndProjectId: jest.fn(() => Promise.resolve([])),
      createWithNextIid: jest.fn((_projectId: number, data: Record<string, unknown>) =>
        Promise.resolve({ id: 1000, iid: "1", ...data }),
      ),
    };
    projectRepository = {
      getById: jest.fn(() =>
        Promise.resolve({ id: SOURCE_PROJECT, organizationId: ORG_ID, deletedAt: null }),
      ),
    };

    // Only the collaborators importTasks touches are real mocks; the rest of
    // the constructor deps are inert placeholders.
    service = new TaskService(
      {} as never,
      assetsService as never,
      taskRepository as never,
      {} as never,
      projectRepository as never,
      {} as never,
      {} as never,
    );
  });

  it("rejects importing from the same project", async () => {
    await expect(importTasks([1], TARGET_PROJECT)).rejects.toThrow(BadRequestException);
  });

  it.each([
    ["missing", null],
    ["soft-deleted", { id: SOURCE_PROJECT, organizationId: ORG_ID, deletedAt: new Date() }],
    ["cross-org", { id: SOURCE_PROJECT, organizationId: ORG_ID + 1, deletedAt: null }],
  ])("404s when the source project is %s", async (_label, project) => {
    projectRepository.getById.mockResolvedValue(project);
    await expect(importTasks([1])).rejects.toThrow(NotFoundException);
  });

  it("reports unknown source ids as failed while importing the rest", async () => {
    taskRepository.getAllByIdsAndProjectId.mockResolvedValue([sourceTask(1)]);

    const result = await importTasks([1, 99]);

    expect(result.imported).toHaveLength(1);
    expect(result.failed).toEqual([{ sourceTaskId: 99, reason: "Source task not found" }]);
  });

  it("maps the source-task unique violation to 'Already imported' and continues", async () => {
    taskRepository.getAllByIdsAndProjectId.mockResolvedValue([sourceTask(1), sourceTask(2)]);
    taskRepository.createWithNextIid.mockRejectedValueOnce(
      uniqueViolation("task_source_task_unique_idx"),
    );

    const result = await importTasks([1, 2]);

    expect(result.failed).toEqual([{ sourceTaskId: 1, reason: "Already imported" }]);
    expect(result.imported).toHaveLength(1);
    expect(result.imported[0].sourceTaskId).toBe(2);
  });

  it("fails a single item when its GCS copy rejects, importing the rest", async () => {
    taskRepository.getAllByIdsAndProjectId.mockResolvedValue([sourceTask(1), sourceTask(2)]);
    assetsService.copyFile.mockRejectedValueOnce(new Error("gcs down"));

    const result = await importTasks([1, 2]);

    expect(result.failed).toEqual([{ sourceTaskId: 1, reason: "Import failed" }]);
    expect(result.imported).toHaveLength(1);
  });

  it("cleans up copied objects when the task row insert fails", async () => {
    taskRepository.getAllByIdsAndProjectId.mockResolvedValue([sourceTask(1)]);
    taskRepository.createWithNextIid.mockRejectedValue(new Error("db down"));

    const result = await importTasks([1]);

    expect(result.failed).toEqual([{ sourceTaskId: 1, reason: "Import failed" }]);
    // Both the copied asset and the copied thumbnail get deleted.
    expect(assetsService.deleteFile).toHaveBeenCalledTimes(2);
  });

  it("creates a reset TODO task pointing at the copied objects", async () => {
    taskRepository.getAllByIdsAndProjectId.mockResolvedValue([sourceTask(1)]);

    const result = await importTasks([1]);

    expect(result.failed).toHaveLength(0);
    expect(taskRepository.createWithNextIid).toHaveBeenCalledWith(TARGET_PROJECT, {
      projectId: TARGET_PROJECT,
      fileType: TaskFileTypeEnum.GS,
      filePath: publicUrl(`${TARGET_PROJECT}/assets/uuid_task-1.jpeg`),
      thumbnailUrl: publicUrl(`${TARGET_PROJECT}/thumbnails/uuid_task-1.webp`),
      width: 640,
      height: 480,
      status: TaskStatusEnum.TODO,
      updatedBy: USER_ID,
      sourceTaskId: 1,
    });
  });

  it("dedupes requested ids before importing", async () => {
    taskRepository.getAllByIdsAndProjectId.mockResolvedValue([sourceTask(1)]);

    const result = await importTasks([1, 1, 1]);

    expect(taskRepository.getAllByIdsAndProjectId).toHaveBeenCalledWith([1], SOURCE_PROJECT);
    expect(result.imported).toHaveLength(1);
  });

  it("reuses the copied image when the source thumbnail is still the placeholder", async () => {
    const filePath = publicUrl(`${SOURCE_PROJECT}/assets/uuid_image-1.jpeg`);
    taskRepository.getAllByIdsAndProjectId.mockResolvedValue([
      sourceTask(1, { filePath, thumbnailUrl: filePath }),
    ]);

    await importTasks([1]);

    expect(assetsService.copyFile).toHaveBeenCalledTimes(1);
    const created = taskRepository.createWithNextIid.mock.calls[0][1];
    expect(created.thumbnailUrl).toBe(created.filePath);
  });

  it("falls back to the copied image when the thumbnail copy fails", async () => {
    taskRepository.getAllByIdsAndProjectId.mockResolvedValue([sourceTask(1)]);
    assetsService.copyFile
      .mockImplementationOnce((_source: string, dest: string) => Promise.resolve(publicUrl(dest)))
      .mockRejectedValueOnce(new Error("thumbnail object missing"));

    const result = await importTasks([1]);

    expect(result.failed).toHaveLength(0);
    const created = taskRepository.createWithNextIid.mock.calls[0][1];
    expect(created.thumbnailUrl).toBe(created.filePath);
  });
});
