module.exports = {
  root: true,
  extends: ["react-app"],
  settings: {
    react: {
      version: "detect"
    }
  },
  // Resolve plugin conflicts
  plugins: [
    // Force using a single instance of the react plugin
    "react"
  ],
  // Disable all rules that might conflict
  rules: {
    "react/jsx-uses-react": "off",
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off"
  }
};
