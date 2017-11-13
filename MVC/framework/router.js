var hashchange = function (args) {
    //locate the controller and action
    var controllerName = args.controllerName;
    var controller = require(controllerName);
    //execute the action
    var action = args.action;
    var result = controller[action]();
    //pass the view to the renderer
    var view = result.view;

    //render the view into DOM
    var whereToRender = args.element;
    render(view, whereToRender);
    //apply data-binding
    var model = result.model;
    binder.bind(view, model);
}