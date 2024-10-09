import { SearchBar, NavBar } from "./components";
import { Box } from "@mui/material";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

function App() {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" height="100vh" width="100%">
      <Box position="sticky" top={0} width="100%" zIndex={1000}>
        <NavBar />
      </Box>
      <Box display="flex" flex="1" alignItems="center" justifyContent="center" width="50%">
        <SearchBar onSearch={(searchValue) => console.error(searchValue)} />
      </Box>
    </Box>
  );
}

export default App;
