# COMMNANDS
subscribe:
   	docker exec -it ${CONTAINER} -c 'mosquitto_sub -h test.mosquitto.org -t "#" -v'