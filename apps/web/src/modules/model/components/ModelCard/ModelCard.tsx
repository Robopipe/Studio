import { Model } from "@repo/schema";
import { Badge, BadgeVariant, Container, Stack, Text } from "@repo/ui";
import clsx from "clsx";
import { Link, useParams } from "react-router";
import styles from "./ModelCard.module.scss";

export interface ModelCardProps {
  model: Model;
  order: number;
}

export const ModelCard = ({ model, order }: ModelCardProps) => {
  const { projectId, modelId } = useParams();
  const getBadgeVariant = (status: Model["status"]): BadgeVariant => {
    switch (status) {
      case "TRAINING":
        return "neutral";
      case "DRAFT":
        return "neutral";
      case "CONVERTING":
        return "neutral";
      case "ERROR":
        return "error";
      default:
        return "success";
    }
  };

  return (
    <Link
      to={`/projects/${projectId}/models/${model.id}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <Container
        className={clsx([
          styles.modelCard,
          model.id.toString() === modelId && styles["modelCard--active"],
        ])}
        paddingX="sm"
        paddingY="sm"
      >
        <Stack gap={8}>
          <Stack direction="row">
            <Badge>v{order}</Badge>
            <Badge variant={getBadgeVariant(model.status)}>
              {model.status.toLowerCase()}
            </Badge>
          </Stack>
          <Text variant="text-16" weight="700" as="p">
            {model.name}
          </Text>
          <Text variant="text-12" color="text-secondary" as="p">
            {new Date(model.createdAt).toLocaleString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </Stack>
      </Container>
    </Link>
  );
};
