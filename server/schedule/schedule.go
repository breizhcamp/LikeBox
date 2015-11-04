package schedule

import (
	"encoding/json"
	"io/ioutil"
	"net/http"
)

type Talk struct {
	Event_key   string
	Name        string
	Event_start string
	Event_end   string
	Event_type  string
	Id          string
	Venue_id    string
	Speakers    string
}

func Download(url string) *[]Talk {
	println("Downloading schedule from " + url)
	resp, err := http.Get(url)
	if err != nil {
		// handle error
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)

	println("Downloaded schedule")
	schedule := make([]Talk, 0)
	json.Unmarshal(body, &schedule)

	return &schedule
}
