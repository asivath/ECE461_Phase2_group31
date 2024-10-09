import React, { useState } from "react";
import { TextField, InputAdornment, Button, Box, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

type SearchBarProps = {
  onSearch: (searchValue: string) => void;
};

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [searchValue, setSearchValue] = useState("");
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
  };

  return (
    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" width="100%" px={3}>
      <Typography variant="h4" mb={2}>
        Search for a package
      </Typography>
      <TextField
        variant="outlined"
        fullWidth
        value={searchValue}
        onChange={handleInputChange}
        placeholder="Type package name..."
        sx={{
          borderRadius: 2,
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
          "& .MuiOutlinedInput-root": {
            borderRadius: 3,
            paddingRight: 1
          },
          "& .MuiInputAdornment-root": {
            marginRight: "8px"
          }
        }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => onSearch(searchValue)}
                  sx={{ borderRadius: 3 }}>
                  Search
                </Button>
              </InputAdornment>
            )
          }
        }}
      />
    </Box>
  );
};
