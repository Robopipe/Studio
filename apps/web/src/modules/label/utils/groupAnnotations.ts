import { Annotation } from "../types/annotations";

/** Assign a groupId to all selected annotations, forcing them contiguous.
 *  If any selected annotation already belongs to a group, that groupId is
 *  reused so unselected siblings stay in the same group. When multiple
 *  groups are present in the selection the first one wins and the others
 *  are dissolved. */
export function groupSelected(
  annotations: Annotation[],
  selectedIds: Set<string>,
): Annotation[] {
  if (selectedIds.size < 2) return annotations;
  const selected = annotations.filter((a) => selectedIds.has(a.id));
  const labelIds = new Set(selected.map((a) => a.labelId));
  if (labelIds.size !== 1) return annotations;

  // Reuse an existing groupId from the selection, or mint a new one.
  const existingGroupId = selected.find((a) => a.groupId)?.groupId ?? null;
  const groupId = existingGroupId ?? crypto.randomUUID();

  const withGroup = annotations.map((a) =>
    selectedIds.has(a.id) ? { ...a, groupId } : a,
  );

  // Auto-dissolve any group that became a singleton because one of its
  // members was pulled into the new/merged group.
  const resolved = autoDissolve(withGroup);

  return makeGroupContiguous(resolved, groupId);
}

/** Clear groupId from all annotations in the given groups (by groupId or specific ids). */
export function ungroupAnnotations(
  annotations: Annotation[],
  groupIds: Set<string>,
): Annotation[] {
  const result = annotations.map((a) =>
    a.groupId && groupIds.has(a.groupId) ? { ...a, groupId: null } : a,
  );
  return autoDissolve(result);
}

/** Move an annotation into a group, repositioning it adjacent to the group's members. */
export function addToGroup(
  annotations: Annotation[],
  regionId: string,
  targetGroupId: string,
): Annotation[] {
  const region = annotations.find((a) => a.id === regionId);
  const groupMember = annotations.find((a) => a.groupId === targetGroupId);
  if (!region || !groupMember) return annotations;

  if (region.labelId !== groupMember.labelId) return annotations;

  const withGroup = annotations.map((a) =>
    a.id === regionId ? { ...a, groupId: targetGroupId } : a,
  );

  // Auto-dissolve any group that the moved annotation left behind.
  const resolved = autoDissolve(withGroup);

  return makeGroupContiguous(resolved, targetGroupId);
}

/** Remove an annotation from its group, auto-dissolving if the group falls below 2. */
export function removeFromGroup(
  annotations: Annotation[],
  regionId: string,
): Annotation[] {
  const oldGroupId = annotations.find((a) => a.id === regionId)?.groupId ?? null;

  const result = annotations.map((a) =>
    a.id === regionId ? { ...a, groupId: null } : a,
  );

  const dissolved = autoDissolve(result);

  // Compact the remaining group members in case the removed annotation was
  // between them (leaving a gap that would split the group in the sidebar).
  if (oldGroupId && dissolved.some((a) => a.groupId === oldGroupId)) {
    return makeGroupContiguous(dissolved, oldGroupId);
  }

  return dissolved;
}

/**
 * When pasting: if clipboard has ≥2 members sharing a single groupId, mint a
 * new groupId for the clones. Mixed or single-group pastes are ungrouped.
 */
export function assignPasteGroups(pastedAnnotations: Annotation[], sourceAnnotations: Annotation[]): Annotation[] {
  const sourceGroupIds = new Map<string, string>();
  for (const a of sourceAnnotations) {
    if (a.groupId) sourceGroupIds.set(a.id, a.groupId);
  }

  // Map original groupId → how many pasted items share it
  const groupCount = new Map<string, number>();
  for (const a of pastedAnnotations) {
    const srcGroupId = sourceGroupIds.get(a.id);
    if (srcGroupId) groupCount.set(srcGroupId, (groupCount.get(srcGroupId) ?? 0) + 1);
  }

  // Map original groupId → new groupId (only for groups with ≥2 members)
  const groupIdMap = new Map<string, string>();
  for (const [origId, count] of groupCount) {
    if (count >= 2) groupIdMap.set(origId, crypto.randomUUID());
  }

  return pastedAnnotations.map((a) => {
    const srcGroupId = sourceGroupIds.get(a.id);
    if (!srcGroupId) return a;
    const newGroupId = groupIdMap.get(srcGroupId);
    return newGroupId ? { ...a, groupId: newGroupId } : { ...a, groupId: null };
  });
}

function makeGroupContiguous(annotations: Annotation[], groupId: string): Annotation[] {
  const members = annotations.filter((a) => a.groupId === groupId);
  const nonMembers = annotations.filter((a) => a.groupId !== groupId);

  // Find the lowest index position among members in the original array
  const firstMemberIdx = annotations.findIndex((a) => a.groupId === groupId);
  if (firstMemberIdx === -1) return annotations;

  // Count non-members that appear before that position
  let insertAfter = 0;
  for (let i = 0; i < firstMemberIdx; i++) {
    if (annotations[i].groupId !== groupId) insertAfter++;
  }

  const result = [...nonMembers];
  result.splice(insertAfter, 0, ...members);
  return result;
}

function autoDissolve(annotations: Annotation[]): Annotation[] {
  const groupCounts = new Map<string, number>();
  for (const a of annotations) {
    if (a.groupId) groupCounts.set(a.groupId, (groupCounts.get(a.groupId) ?? 0) + 1);
  }

  const toDissolve = new Set<string>();
  for (const [id, count] of groupCounts) {
    if (count < 2) toDissolve.add(id);
  }

  if (toDissolve.size === 0) return annotations;
  return annotations.map((a) =>
    a.groupId && toDissolve.has(a.groupId) ? { ...a, groupId: null } : a,
  );
}

/** Compute the set of groupIds for which all annotations are in the selected set. */
export function getSelectedGroupIds(
  annotations: Annotation[],
  selectedIds: Set<string>,
): Set<string> {
  const groupToAll = new Map<string, string[]>();
  for (const a of annotations) {
    if (!a.groupId) continue;
    if (!groupToAll.has(a.groupId)) groupToAll.set(a.groupId, []);
    groupToAll.get(a.groupId)!.push(a.id);
  }

  const result = new Set<string>();
  for (const [groupId, ids] of groupToAll) {
    if (ids.every((id) => selectedIds.has(id))) result.add(groupId);
  }
  return result;
}

/** Check if all annotations in a selection share one label and there are ≥2. */
export function canGroupSelection(
  annotations: Annotation[],
  selectedIds: Set<string>,
): boolean {
  if (selectedIds.size < 2) return false;
  const selected = annotations.filter((a) => selectedIds.has(a.id) && a.type !== "class");
  if (selected.length < 2) return false;
  const labelIds = new Set(selected.map((a) => a.labelId));
  return labelIds.size === 1;
}
