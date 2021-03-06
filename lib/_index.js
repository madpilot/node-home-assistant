'use strict';
const debug    = require('debug')('home-assistant');
const HaEvents = require('./ha-events');
const HaApi    = require('./ha-api');

const DEFAULTS = {
    baseUrl: 'http://localhost:8123',
    apiPass: null,
    api:     {},
    events:  {
        transport: 'sse'    // For future support of websockets
    }
};

function HomeAssistant(config) {
    if (! (this instanceof HomeAssistant)) { return new HomeAssistant(config); }
    this.config    = Object.assign({}, DEFAULTS, config);

    this.events = new HaEvents(this.config);
    this.api    = new HaApi(this.config);
    this._init();
}

HomeAssistant.prototype._init = function () {
    // Get the initial state list
    // create state listener to watch events and keep local copy of updated states
    this.api.getStates()
        .then(states => (this.states = states))
        .then(() => this.events.on('ha_events:state_changed', (evt) => this._onStateChanged(evt)))
        .catch(debug);
    this.api.getServices()
        .then(services => (this.availableServices = services))
        .catch(debug);
    this.api.getEvents()
        .then(events => (this.availableEvents = events))
        .catch(debug);
};

HomeAssistant.prototype._onStateChanged = function (changedEntity) {
    const cachedEntity = this.states[changedEntity.entity_id];
    if (!cachedEntity) { throw new Error('Got state changed event for entity that was not know, this should not happen'); }
    this.states[changedEntity.entity_id] = changedEntity.event.new_state;
};
module.exports = HomeAssistant;
