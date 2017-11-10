define((require) => {
    var Vue = require('vue');

    //singleton instance to be a global EventBus / pubsub
    return new Vue();
});