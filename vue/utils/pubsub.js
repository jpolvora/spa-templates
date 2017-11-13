define((require) => {
    var Vue = require('vue');

    //singleton instance to be a global EventBus / pubsub
    const vue = new Vue();
    return vue; //export vue instance
});