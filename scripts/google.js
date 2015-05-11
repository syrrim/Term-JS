function pick(value, other){
	if(value === undefined){
		return other;
	}
	return value;
}
function results(query, amount){
	return new Promise(function(resolve, reject){
		var newQuery = encodeURI(query.replace(" ", "+"));
		$.ajax({
			url: "https://www.googleapis.com/customsearch/v1element?" + ["key=AIzaSyCVAXiUzRYsML1Pv6RwSG1gunmMikTzQqY",
				"rsz=filtered_cse",
				"num=" + pick(amount, 10),
				"hl=en",
				"prettyPrint=false",
				"source=gcsc",
				"gss=.ca",
				"sig=cb6ef4de1f03dde8c26c6d526f8a1f35",
				"cx=009520198101815594489:e-3xa5rpink",
				"q="+newQuery,
				"&sort=",
				"googlehost=www.google.com",
				"oq=" + newQuery,
				"gs_l=partner.3...1869.3159.0.3553.5.5.0.0.0.0.60.276.5.5.0.gsnos%2Cn%3D13...0.1288j583398j5..1ac.1.25.partner..5.0.0.e4jJxFj5VpE"
				].join("&"),
			method: "GET",
			dataType: "jsonp",
		})
			.done(function(json){
					resolve(json)
				})
			.fail(function(error){
					reject(error)
			})
	});
}


window.process.google = function(args, sdtin, stdout, stderr, comm){
	results(args[1], 15).then(function(json){
			//stdout.writeln(JSON.stringify(json.results, 3, 4))
			for(var i = 0; i < json.results.length; i++){
				stdout.writeln(json.results[i].url);
			}
			comm.finish(0)
		},
		function(error){
			stderr.writeln(JSON.stringify(error, 3))
			comm.finish(-1);	
		}
	)
};