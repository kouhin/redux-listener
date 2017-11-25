module.exports ={
  presets: [
    [
      "@babel/preset-env",
      {
        loose: true,
        modules: process.env.BABEL_ENV === "es" ? false : "commonjs",
        forceAllTransforms: process.env.NODE_ENV === "production"
      }
    ]
  ]
};
