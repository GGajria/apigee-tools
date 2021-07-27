 			context.setVariable("flow.host", "pkc-ewzgj.europe-west4.gcp.confluent.cloud:9092")
			var topic = context.getVariable("request.queryparam.topic") || context.getVariable("flow.topic") || "lala"
			
			context.setVariable("flow.topic", topic);
			context.setVariable("flow.user", "Q4O7TG3K54KDXPCN");
			context.setVariable("flow.password", "9Q17/EXM5ren7Y2aq/dQJFjDvb0VZr8Lextu7xFouw+GJrNyOocfkcATTdF0nwwD");
		