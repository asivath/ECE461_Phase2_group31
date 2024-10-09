import { AppBar, Toolbar, Typography, Box, Avatar } from "@mui/material";
import logo from "../assets/logo.webp";

export const NavBar = () => {
  return (
    <AppBar
      position="static"
      sx={{ background: "linear-gradient(90deg, rgba(79,111,170,1) 7%, rgba(41,83,134,1) 64%);" }}>
      <Toolbar>
        <Box display="flex" alignItems="center" width="100%">
          <Avatar sx={{ display: { md: "flex" }, mr: 1 }}>
            <img
              src={logo}
              style={{ width: "100%", height: "auto" }}
              alt="logo"
              width={100}
              height={100}
              loading="lazy"
            />
          </Avatar>
          <Typography variant="h6" component="div">
            package-rater
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
