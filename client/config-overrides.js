const { override, addLessLoader, fixBabelImports, addWebpackPlugin } = require('customize-cra');
const { getThemeVariables } = require('antd/dist/theme');
const AntdDayjsWebpackPlugin = require('antd-dayjs-webpack-plugin');
//const TerserPlugin = require('terser-webpack-plugin');

/*
const Terser = config => {
  config.plugins.push(new TerserPlugin({
    parallel: true,
    terserOptions: {
      ecma: 6,
    },
  }))
  return config
	
}
*/

module.exports = override(
  //customise-cra plugins
  fixBabelImports('antd', {
    libraryDirectory: 'es',
    style: true,
  }),
  addLessLoader({
    javascriptEnabled: true,
    modifyVars: getThemeVariables({
      dark: true,
      compact: false,
    })
  }),
  addWebpackPlugin(
    new AntdDayjsWebpackPlugin()
  )
  //Terser
);