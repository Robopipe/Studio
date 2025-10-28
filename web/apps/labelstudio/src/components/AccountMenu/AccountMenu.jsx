// import { useEffect } from "react";
// import { useCurrentUser } from "../../providers/CurrentUser";
// import { Block, Elem } from "../../utils/bem";
// import { Dropdown } from "../Dropdown/Dropdown";
// import "./AccountMenu.scss";
// import { Menu } from "../Menu/Menu";
// import { LsDoor, IconSettings } from "../../assets/icons";
// import { absoluteURL } from "../../utils/helpers";
// import { pages } from "@humansignal/app-common";

// export const AccountMenu = () => {
//   const { user } = useCurrentUser();

//   return (
//     <Dropdown.Trigger
//       align="right"
//       content={
//         <Menu>
//           <Menu.Item
//             icon={<IconSettings />}
//             label="Account &amp; Settings"
//             href={pages.AccountSettingsPage.path}
//           />
//           <Menu.Item
//             icon={<LsDoor />}
//             label="Log Out"
//             href={absoluteURL("/logout")}
//             data-external
//           />
//         </Menu>
//       }
//     >
//       <Block name="account-menu-trigger">
//         <Elem name="initials">{user?.initials}</Elem>
//       </Block>
//     </Dropdown.Trigger>
//   );
// };
