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

sync-portable:
	cp css/* portable/css/
	cp js/* portable/js/
	@echo "Static assets synced to portable/. Note: portable/calculator.html may still need manual inlining if used as a single file."