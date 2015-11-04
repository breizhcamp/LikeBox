package schedule

import (
	"testing"
)

func TestDownload(t *testing.T) {

	schedule := *Download("http://dockerconeu2015.sched.org/api/session/list?api_key=cd5a8871cb3bc3bc8a732d2b3e30bf39&format=json")

	if len(schedule) == 0 {
		t.Error("Expected some data, got ", schedule)
	}
}
