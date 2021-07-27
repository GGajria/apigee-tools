package kafka.client;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

import org.apache.kafka.clients.consumer.Consumer;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.clients.producer.Callback;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.Producer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;

import com.google.gson.Gson;

public class KafkaClient {

	Properties props;

	public KafkaClient(String host, String username, String password, String type) throws IOException {

		this.props = this.loadConfig(host, username, password);
		if (type.equalsIgnoreCase("producer")) {
			props.put(ProducerConfig.ACKS_CONFIG, "all");
			props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG,
					"org.apache.kafka.common.serialization.StringSerializer");
			props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG,
					"org.apache.kafka.common.serialization.StringSerializer");
		} else if (type.equalsIgnoreCase("consumer")) {
			props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG,
					"org.apache.kafka.common.serialization.StringDeserializer");
			props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG,
					"org.apache.kafka.common.serialization.StringDeserializer");
			props.put(ConsumerConfig.GROUP_ID_CONFIG, "apigee-java-consumer-1");
			props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
		}

	}

	private Properties loadConfig(String host, String username, String password) throws IOException {
		final Properties cfg = new Properties();

		StringBuilder sb = new StringBuilder();
		sb.append("# Required connection configs for Kafka producer, consumer, and admin").append("\n")
				.append("bootstrap.servers=" + host).append("\n")
				.append("security.protocol=SASL_SSL").append("\n")
				.append("sasl.jaas.config=org.apache.kafka.common.security.plain.PlainLoginModule   required username='"
						+ username + "'   password='" + password + "';")
				.append("\n").append("sasl.mechanism=PLAIN").append("\n")
				.append("# Required for correctness in Apache Kafka clients prior to 2.6").append("\n")
				.append("client.dns.lookup=use_all_dns_ips").append("\n")
				.append("# Best practice for Kafka producer to prevent data loss").append("\n").append("acks=all")
				.append("\n").append("# Required connection configs for Confluent Cloud Schema Registry").append("\n")
				.append("schema.registry.url=https://{{ SR_ENDPOINT }}").append("\n")
				.append("basic.auth.credentials.source=USER_INFO").append("\n")
				.append("basic.auth.user.info={{ SR_API_KEY }}:{{ SR_API_SECRET }}").append("\n");

		try (InputStream inputStream = new ByteArrayInputStream(sb.toString().getBytes())) {
			cfg.load(inputStream);
		}
		return cfg;
	}

	public void sendMessage(String topic, String key, String message) throws IOException {

		// props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG,
		// "io.confluent.kafka.serializers.KafkaJsonSerializer");

		Producer<String, String> producer = new KafkaProducer<String, String>(this.props);

		System.out.printf("Producing record: %s\t%s%n", key, message);
		producer.send(new ProducerRecord<String, String>(topic, key, message), new Callback() {
			@Override
			public void onCompletion(RecordMetadata m, Exception e) {
				if (e != null) {
					e.printStackTrace();
				} else {
					System.out.printf("Produced record to topic %s partition [%d] @ offset %d%n", m.topic(),
							m.partition(), m.offset());
				}
			}
		});

		// producer.flush();
		producer.close();
	}

	public String receiveMessages(String topic) throws IOException {

		final Consumer<String, String> consumer = new KafkaConsumer<String, String>(this.props);

		consumer.subscribe(Arrays.asList(topic));

		Long total_count = 0L;

		try {
			Gson gs = new Gson();
			Map<String, String> map = new HashMap<String, String>();
			int noMessageFound = 0;
			while (true) {

				ConsumerRecords<String, String> records = consumer.poll(500);

				if (records.count() == 0) {
					noMessageFound++;
					if (noMessageFound > 5) {
						System.out.println("Loop: " + noMessageFound);
						break;
					} else {
						System.out.println("Loop: " + noMessageFound);
						continue;
					}

				}

				System.out.println("Got " + records.count() + " records");
				for (ConsumerRecord<String, String> record : records) {
					map.put(record.key(), record.value());
					String key = record.key();
					String value = record.value();
					total_count += 1;

					System.out.printf("--Consumed record with key %s and value %s, and updated total count to %d%n",
							key, value, total_count);
				}

			}
			String jsonOp = gs.toJson(map);
			System.out.println("Final JSON: " + jsonOp);
			return jsonOp;
		} finally {
			consumer.commitAsync();
			consumer.close();
		}
	}

}
