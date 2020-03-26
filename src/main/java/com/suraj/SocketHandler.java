package com.suraj;

import java.io.IOException;
import java.util.List;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;

@Component
public class SocketHandler extends TextWebSocketHandler {
	private static final Gson gson = new GsonBuilder().create();
	List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();
	ConcurrentHashMap<WebSocketSession, WebSocketSession> pairs = new ConcurrentHashMap<>();

	@Override
	public void handleTextMessage(WebSocketSession session, TextMessage message)
			throws InterruptedException, IOException {
		JsonObject jsonMessage = gson.fromJson(message.getPayload(), JsonObject.class);
		int count = 0;

		if (jsonMessage.get("type").getAsString().equals("login")) {
			// for more then one user
			if (sessions.size() > 1) {
				for (WebSocketSession webSocketSession : sessions) {
					System.out.println("session: " + count++ + " :: " + webSocketSession.getId());
					if (webSocketSession.getId().equals(session.getId())) {
						sessions.remove(session);
					}
				}

				WebSocketSession pickedWebSocketSession = pickRandom();
				sessions.remove(pickedWebSocketSession);
				if (pickedWebSocketSession.isOpen()) {
					pickedWebSocketSession.sendMessage(message);
					session.sendMessage(message);
                    pairs.put(pickedWebSocketSession, session);
                    pairs.put(session, pickedWebSocketSession);
				}
			}
		} else {
			// check for avail
			if (pairs.containsKey(session)) {
				WebSocketSession toSession = pairs.get(session);
				if (toSession.isOpen()) {
					toSession.sendMessage(message);
				}
			}
		}

		System.out.println("type : " + jsonMessage.get("type").getAsString());

	}

	private WebSocketSession pickRandom() {
		Random rand = new Random();
		return sessions.get(rand.nextInt(sessions.size()));
	}

	@Override
	public void afterConnectionEstablished(WebSocketSession session) throws Exception {
		sessions.add(session);
	}

	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
		sessions.remove(session);
	}
}