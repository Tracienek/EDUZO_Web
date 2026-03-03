const React = require("react");
const ReactDOMServer = require("react-dom/server");

function renderEmail(Component, props) {
    const element = React.createElement(Component, props);
    return "<!doctype html>" + ReactDOMServer.renderToStaticMarkup(element);
}

module.exports = { renderEmail };
