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
      className="min-h-0 overflow-y-auto border-l border-black/10 bg-black/[0.03] p-4 pl-6"
    >
      <TabsList>
        <TabsTrigger value="photos">Captured photos</TabsTrigger>
        <TabsTrigger value="videos">Captured videos</TabsTrigger>
      </TabsList>
      <TabsContent value="photos">
        <CapturedPhotos />
      </TabsContent>
      <TabsContent value="videos">
        <CapturedVideos />
      </TabsContent>
    </Tabs>
  );
};
