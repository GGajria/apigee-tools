package kafka.client;

import java.io.IOException;
import java.util.Date;

import com.apigee.flow.execution.Action;
import com.apigee.flow.execution.ExecutionContext;
import com.apigee.flow.execution.ExecutionResult;
import com.apigee.flow.execution.spi.Execution;
import com.apigee.flow.message.MessageContext;

public class ApigeeKafkaProducerClient implements Execution {

	public ExecutionResult execute(MessageContext messageContext, ExecutionContext executionContext) {

		try {

			String host = messageContext.getVariable("flow.host");
			String topic = messageContext.getVariable("flow.topic");
			String key = messageContext.getVariable("flow.key");
			String message = messageContext.getVariable("flow.message");
			String user = messageContext.getVariable("flow.user");
			String password = messageContext.getVariable("flow.password");

			KafkaClient kc = new KafkaClient(host, user, password, "producer");
			kc.sendMessage(topic, key, message);
			return ExecutionResult.SUCCESS;

		} catch (RuntimeException ex) {
			ExecutionResult executionResult = new ExecutionResult(false, Action.ABORT);
			messageContext.setVariable("JAVA_ERROR", ex.getMessage());

			return executionResult;
		} catch (IOException e) {
			ExecutionResult executionResult = new ExecutionResult(false, Action.ABORT);
			messageContext.setVariable("JAVA_IO_ERROR", e.getMessage());
			return executionResult;
		}
	}


	public static void main(final String[] args) throws IOException {
		final String TOPIC = "lala";
		Date date = new Date();
		final String KEY = String.valueOf(date.getTime());
		final String HOST = "<kafkahost>";
		
		
		final String MESSAGE = "{\"hello\":\""+date.getTime()+ "\"}";
		final String username = "<username>";
		final String password = "<password>";

		KafkaClient kc = new KafkaClient(HOST, username, password, "producer");
		kc.sendMessage(TOPIC, KEY, MESSAGE);
		
		//kc.receiveMessages(TOPIC);

		

	}
}
