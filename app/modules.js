GlobalConfig = {
// 
    filter: 'debug',
//    filter: 'info',
    debug: true,
    combine: false,
    groups: {
        d3: {
//            base: "http://d3js.org/",
            modules: {
               "d3": {
                   "fullpath": "/assets/javascripts/d3.v2.min.js"
               }
          }
        },
        juju: {
            modules: {
		// Primitives

                "svg-layouts" : {
                    fullpath: "/assets/javascripts/svg-layouts.js"
                },

                "reconnecting-websocket": {
                    fullpath: "/assets/javascripts/reconnecting-websocket.js"
                },

		// Views

                "juju-view-environment": {
                    fullpath: "/views/environment.js"
                },

                "juju-view-service": {
                    fullpath: "/views/service.js"
                },

                "juju-view-charmsearch": {
                    fullpath: "/views/search.js"
                },

                "juju-view-charm-collection": {
                    fullpath: "/views/charm.js"
                },

                "juju-views":  {
                    use: ["juju-view-environment", 
			  "juju-view-service", 
			  "juju-view-charmsearch",
			  "juju-view-charm-collection"]
                },
		
		// Models

                "juju-models": {
                    requires: ["model", "model-list"],
                    fullpath: "/models/models.js"
                },

		// Connectivity		
                "juju-env": {
                    requires: ["reconnecting-websocket"],
                    fullpath: "/store/env.js"
                },

                "juju-charm-store": {
                    fullpath: "/store/charm.js"
                },
		

		"juju-controllers": {
		    use: ["juju-env", "juju-charm-store"],
                },

		// App
                "juju-gui": {
                    fullpath: "/app.js",
                    requires: [
			"juju-controllers",
                        "juju-views",
                        "juju-models",
                        "svg-layouts"
                    ]
                }
            }
        }
    }
};

// Node compat for testing
if (typeof(exports) !== "undefined") {
    exports.GlobalConfig = GlobalConfig;
}