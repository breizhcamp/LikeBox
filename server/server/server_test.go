package server

import (
	"testing"
	"net/http/httptest"
	"net/http"
	"log"
	"io/ioutil"
	"strings"
)

func TestUnauthorized(t *testing.T) {

	server := NewAPIServer(StubBackend{})
	ts := httptest.NewServer(server)
	defer ts.Close()

	res, err := http.Get(ts.URL+"/status/1")
	if err != nil {
		log.Fatal(err)
	}
	log.Println("Status code "+res.Status)
	if res.StatusCode != http.StatusUnauthorized {
		log.Fatal("Should have been rejected as unahtuorized")
	}
}

func TestStatus(t *testing.T) {

	server := NewAPIServer(StubBackend{})
	ts := httptest.NewServer(server)
	defer ts.Close()

	client := &http.Client{}
	req, err := http.NewRequest("GET", ts.URL+"/status/1", nil)
	req.SetBasicAuth("bzhcamp","CHANGEME")
	res, err := client.Do(req)
	if err != nil {
		log.Fatal(err)
	}
	payload, err := ioutil.ReadAll(res.Body)
	res.Body.Close()
	if err != nil {
		log.Fatal(err)
	}

	json := string(payload)
	if !strings.Contains(json, "\"Timestamp\": 12345") {
		log.Fatal("Unexpected status "+json)
	}
	if !strings.Contains(json, "\"Schedule_mtime\": 67890") {
		log.Fatal("Unexpected status "+json)
	}
}

type StubBackend struct {
}

func (s StubBackend) GetStatus(box string) (Status, error) {
	return Status{12345, 67890}, nil
}

func (s StubBackend) Vote(box string, session string, timestamp int64, vote int) error {
	return nil
}
