import { useNavigate, useLocation } from "react-router-dom";
import { paths } from "../utils/GlobalVariables";
import { Flex, Image, Box } from "@chakra-ui/react";
import { useThemeStore } from "../utils/ThemeStore";


function NavBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;
    const { theme, toggleTheme } = useThemeStore();

    if (!paths.showLogoOnly && !paths.showNavBar) {
        return null;
    }

    return (
        <Flex
            as="nav"
            justify="space-around"
            align="center"
            py={3}
            bg="var(--bg-color)"
            zIndex={10}
            position="sticky"
            top={0}
            borderBottom={paths.showLogoOnly ? "none" : "1px solid var(--text-color)"}
            className="no-select"
            transition="background-color 0.3s ease, border-bottom-color 0.3s ease"
        >
            {paths.showLogoOnly ? (
                <Box position="relative" w="100%" display="flex" justifyContent="center">
                    <Image src="Logo.svg" alt="Logo" boxSize="16%" maxW="150px" className="no-filter" />
                    <Box position="absolute" right="5" top="50%" transform="translateY(-50%)">
                        <button onClick={toggleTheme} className="theme-toggle">
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>
                    </Box>
                </Box>
            ) : (
                <>
                    <Image
                        src={currentPath === "/search" ? "Search_Active.svg" : "Search.svg"}
                        alt="Search"
                        cursor="pointer"
                        boxSize="8%"
                        maxW="3.5rem"
                        onClick={() => navigate("/search")}
                    />
                    <Box position="relative" display="flex" alignItems="center">
                        <Image src="Logo.svg" alt="Logo" boxSize="5rem" maxW="5rem" className="no-filter" />
                        <button 
                            onClick={toggleTheme} 
                            className="theme-toggle"
                            style={{ marginLeft: '10px' }}
                        >
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>
                    </Box>
                    <Image
                        src={currentPath === "/my-profile" ? "Profile_Active.svg" : "Profile.svg"}
                        alt="Profile"
                        cursor="pointer"
                        boxSize="8%"
                        maxW="3.5rem"
                        onClick={() => navigate("/my-profile")}
                    />
                    
                </>
            )}
        </Flex>
    );
}

export default NavBar;
