import { useCallback, useContext } from "react";
import { Button } from "../../components";
import { Form, Input, Select, TextArea } from "../../components/Form";
import { RadioGroup } from "../../components/Form/Elements/RadioGroup/RadioGroup";
import { ProjectContext } from "../../providers/ProjectProvider";
import { Block, Elem } from "../../utils/bem";
import { EnterpriseBadge } from "../../components/Badges/Enterprise";
import "./settings.scss";
import { HeidiTips } from "../../components/HeidiTips/HeidiTips";
import { FF_LSDV_E_297, isFF } from "../../utils/feature-flags";
import { createURL } from "../../components/HeidiTips/utils";
import { Caption } from "../../components/Caption/Caption";

export const GeneralSettings = () => {
  const { project, fetchProject } = useContext(ProjectContext);

  const updateProject = useCallback(() => {
    if (project.id) fetchProject(project.id, true);
  }, [project]);

  const colors = [
    "#FDFDFC",
    "#FF4C25",
    "#FF750F",
    "#ECB800",
    "#9AC422",
    "#34988D",
    "#617ADA",
    "#CC6FBE"
  ];

  const samplings = [
    {
      value: "Sequential",
      label: "Sequential",
      description: "Tasks are ordered by Data manager ordering"
    },
    {
      value: "Uniform",
      label: "Random",
      description: "Tasks are chosen with uniform random"
    }
  ];

  return (
    <Block name="general-settings">
      <Elem name={"wrapper"}>
        <h1>General Settings</h1>
        <Block name="settings-wrapper">
          <Form
            action="updateProject"
            formData={{ ...project }}
            params={{ pk: project.id }}
            onSubmit={updateProject}
          >
            <Form.Row columnCount={1} rowGap="16px">
              <Input name="title" label="Project Name" />

              <TextArea
                name="description"
                label="Description"
                style={{ minHeight: 128 }}
              />
              <RadioGroup
                name="color"
                label="Color"
                size="large"
                labelProps={{ size: "large" }}
              >
                {colors.map(color => (
                  <RadioGroup.Button key={color} value={color}>
                    <Block name="color" style={{ "--background": color }} />
                  </RadioGroup.Button>
                ))}
              </RadioGroup>

              <RadioGroup
                label="Task Sampling"
                labelProps={{ size: "large" }}
                name="sampling"
                simple
              >
                {samplings.map(({ value, label, description }) => (
                  <RadioGroup.Button
                    key={value}
                    value={`${value} sampling`}
                    label={`${label} sampling`}
                    description={description}
                  />
                ))}
              </RadioGroup>
            </Form.Row>

            <Form.Actions>
              <Form.Indicator>
                <span case="success">Saved!</span>
              </Form.Indicator>
              <Button type="submit" look="primary" style={{ width: 120 }}>
                Save
              </Button>
            </Form.Actions>
          </Form>
        </Block>
      </Elem>
    </Block>
  );
};

GeneralSettings.menuItem = "General";
GeneralSettings.path = "/";
GeneralSettings.exact = true;
