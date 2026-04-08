import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/modules/shadcn/ui/tabs";

import { CapturedPhotos } from "../CapturedPhotos";
import { CapturedVideos } from "../CapturedVideos";

export interface CapturedProps {}

export const Captured = ({}: CapturedProps) => {
  return (
    <Tabs
      defaultValue="photos"
      className="flex min-h-0 flex-col gap-0 overflow-hidden border-l border-border bg-black/[0.03]"
    >
      <TabsList variant="line">
        <TabsTrigger value="photos">Captured photos</TabsTrigger>
        <TabsTrigger value="videos">Captured videos</TabsTrigger>
      </TabsList>
      <TabsContent value="photos" className="min-h-0 flex-1 overflow-y-auto p-4">
        <CapturedPhotos />
      </TabsContent>
      <TabsContent value="videos" className="min-h-0 flex-1 overflow-y-auto p-4">
        <CapturedVideos />
      </TabsContent>
    </Tabs>
  );
};
