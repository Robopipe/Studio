import { format } from "date-fns";
import { Block, Elem } from "../../utils/bem";
import "./ModelCard.scss";

export const ModelCard = ({ model, mod, onClick, badges }) => {
  return (
    <Block name="model-card" mod={mod} onClick={onClick}>
      <Elem name="badges">
        {badges.map((badge, i) => (
          <Elem
            key={`${model.id ?? "new-model"}-badge-${i}`}
            name="badge"
            mod={badge.mod}
          >
            {badge.text}
          </Elem>
        ))}
      </Elem>
      <Elem name="name">{model.name}</Elem>
      <Elem name="timestamp">
        {format(new Date(model.updated_at), "MMM dd, yyyy - HH:mm")}
      </Elem>
    </Block>
  );
};
