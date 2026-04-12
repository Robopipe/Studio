import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";

export interface VideoPlaybackDialogProps {
  videoUrl: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VideoPlaybackDialog = ({
  videoUrl,
  open,
  onOpenChange,
}: VideoPlaybackDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Video Playback</DialogTitle>
        </DialogHeader>
        <video src={videoUrl} controls autoPlay className="w-full rounded-md" />
      </DialogContent>
    </Dialog>
  );
};
