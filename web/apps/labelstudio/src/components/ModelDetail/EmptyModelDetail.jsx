import { Block, Elem } from "../../utils/bem";

export const EmptyModelDetail = () => {
  return (
    <Block name="empty-model">
      <Elem name="title" tag="h1" mod={{ center: true }}>
        Select or create a model
      </Elem>
    </Block>
  );
};
