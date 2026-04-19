.PHONY: serve test open clean

PORT ?= 8080

serve:
	python3 -m http.server $(PORT)

test:
	node test-runner.js

open: serve
	open http://localhost:$(PORT)

clean:
	rm -f $(wildcard icon-*.png)