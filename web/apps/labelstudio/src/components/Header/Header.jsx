import { Block, Elem } from "../../utils/bem";
import {
  IconCamera,
  IconInfere,
  IconLabel,
  IconLogo,
  IconSettings,
  IconTrain,
  IconHelp
} from "../../assets/icons";
import "./Header.scss";
import { absoluteURL } from "../../utils/helpers";
import { useFixedLocation } from "../../providers/RoutesProvider";
import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { ProjectPicker } from "../ProjectPicker/ProjectPicker";
import { useProject } from "../../providers/ProjectProvider";
import { AccountMenu } from "../AccountMenu/AccountMenu";

const NavLink = ({ href, icon, label }) => {
  const location = useFixedLocation();

  return (
    <Elem
      tag="a"
      href={href}
      name="nav-link"
      mod={{ active: location.pathname.includes(href) }}
    >
      <Elem name="icon">{icon}</Elem>
      <Elem tag="span" name="label">
        {label}
      </Elem>
    </Elem>
  );
};

export const Header = () => {
  const location = useFixedLocation();
  const { project } = useProject();
  const projectRe = /\/projects\/[0-9]+\/.*/;

  return (
    <Block tag="header" name="header">
      <Elem tag="nav" name="nav">
        <Elem name="logo-container" tag="a" href="/projects">
          <img
            src={absoluteURL("/static/icons/robopipe-logo.svg")}
            alt="Robopipe Logo"
          />
        </Elem>
        <ProjectPicker />
        <Elem tag="ul" name="main-nav">
          {location.pathname.match(projectRe) && (
            <>
              <li>
                <NavLink
                  icon={<IconCamera />}
                  href={`/projects/${project.id}/capture`}
                  label="Capture"
                />
              </li>
              <li>
                <NavLink
                  icon={<IconLabel />}
                  href={`/projects/${project.id}/data`}
                  label="Label"
                />
              </li>
              <li>
                <NavLink
                  icon={<IconTrain />}
                  href={`/projects/${project.id}/train`}
                  label="Train"
                />
              </li>
              <li>
                <NavLink
                  icon={<IconInfere />}
                  href={`/projects/${project.id}/infere`}
                  label="Infere"
                />
              </li>
            </>
          )}
        </Elem>
        <Elem tag="ul" name="side-nav">
          {location.pathname.match(projectRe) && (
            <li>
              <NavLink
                icon={<IconSettings />}
                href={`/projects/${project.id}/settings`}
                label="Settings"
              />
            </li>
          )}
          <li>
            <NavLink
              icon={<IconHelp />}
              href="https://robopipe.gitbook.io"
              label="Help"
            />
          </li>
          {/* <AccountMenu /> */}
        </Elem>
      </Elem>
    </Block>
  );
};
