import { useEffect, useState } from "react";
import { useAPI } from "../../providers/ApiProvider";
import { Block, Elem } from "../../utils/bem";
import { useProject } from "../../providers/ProjectProvider";
import { Link } from "react-router-dom";
import { useFixedLocation } from "../../providers/RoutesProvider";
import "./ProjectPicker.scss";

export const ProjectPicker = () => {
  const api = useAPI();
  const location = useFixedLocation();
  const { project } = useProject();
  const [projects, setProjects] = useState([]);
  const [open, setOpen] = useState(false);

  const getHref = project => {
    console.log("location.pathname", location.pathname);
    const path = location.pathname.replace(/^\/projects(\/\d+)?\/?/, "");
    return `/projects/${project.id}/${path}`;
  };

  useEffect(() => {
    api.callApi("projects").then(r => setProjects(r.results));
  }, []);

  return (
    <Block name="project-picker" onClick={() => setOpen(prev => !prev)}>
      <Elem tag="span" name="title" mod={{ highlight: !!project.title }}>
        {project.title ?? "Select a project"}
      </Elem>
      {open && (
        <Elem name="dropdown">
          {projects.map(project => (
            <Link key={project.id} to={getHref(project)}>
              {project.title}
            </Link>
          ))}
        </Elem>
      )}
    </Block>
  );
};
