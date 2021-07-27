package kafka.client;

import java.io.IOException;

import org.apache.kafka.clients.consumer.Consumer;
import org.apache.kafka.clients.consumer.ConsumerRecords;

import com.apigee.flow.execution.Action;
import com.apigee.flow.execution.ExecutionContext;
import com.apigee.flow.execution.ExecutionResult;
import com.apigee.flow.execution.spi.Execution;
import com.apigee.flow.message.MessageContext;

public class ApigeeKafkaConsumerClient implements Execution {
	
	public ExecutionResult execute(MessageContext messageContext, ExecutionContext executionContext) {

		try {

			String host = messageContext.getVariable("flow.host");
			String topic = messageContext.getVariable("flow.topic");
			String user = messageContext.getVariable("flow.user");
			String password = messageContext.getVariable("flow.password");

			KafkaClient kc = new KafkaClient(host, user, password, "consumer");
			String s = kc.receiveMessages(topic);
			messageContext.setVariable("flow.response", s);
			
			
			
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
	
	
	public static void main(final String[] args) throws Exception {
		
		final String TOPIC = "lala";
		final String HOST = "<kafkahost>";
		final String username = "<username>";
		final String password = "<password>";

		KafkaClient kc = new KafkaClient(HOST, username, password, "consumer");
		
		String s = kc.receiveMessages(TOPIC);
		System.out.println("Got " + s);
		
	}

	
}
