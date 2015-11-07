package server

import (
	"testing"
	"net/http/httptest"
	"net/http"
	"io/ioutil"
	"github.com/assertgo/assert"
	"strings"
)

func TestUnauthorized(t *testing.T) {
	assert := assert.New(t)

	server := NewAPIServer(StubBackend{})
	ts := httptest.NewServer(server)
	defer ts.Close()

	res, err := http.Get(ts.URL+"/status/1")
	assert.That(err).IsNil()
	assert.ThatInt(res.StatusCode).IsEqualTo(http.StatusUnauthorized)
}

func TestStatus(t *testing.T) {
	assert := assert.New(t)

	server := NewAPIServer(StubBackend{})
	ts := httptest.NewServer(server)
	defer ts.Close()

	client := &http.Client{}
	req, err := http.NewRequest("GET", ts.URL+"/status/1", nil)
	req.SetBasicAuth("bzhcamp","CHANGEME")
	res, err := client.Do(req)
	assert.That(err).IsNil()
	payload, err := ioutil.ReadAll(res.Body)
	res.Body.Close()
	assert.That(err).IsNil()

	json := string(payload)
	assert.ThatString(json).Contains("\"Timestamp\": 12345")
	assert.ThatString(json).Contains("\"Schedule_mtime\": 67890")
}

func TestVote(t *testing.T) {
	assert := assert.New(t)

	server := NewAPIServer(StubBackend{})
	ts := httptest.NewServer(server)
	defer ts.Close()

	client := &http.Client{}
	req, err := http.NewRequest("POST", ts.URL+"/vote/1", strings.NewReader(`{
		"votes" : [ {
			"timestamp": 67890,
			"session": 123,
			"vote": 1
		}, {
			"timestamp": 67890,
			"session": 456,
			"vote": -1
		} ]
	}`))
	req.SetBasicAuth("bzhcamp","CHANGEME")
	res, err := client.Do(req)
	assert.That(err).IsNil()
	payload, err := ioutil.ReadAll(res.Body)
	res.Body.Close()
	assert.That(err).IsNil()

	json := string(payload)
}

type StubBackend struct {
}

func (s StubBackend) GetStatus(box string) (Status, error) {
	return Status{12345, 67890}, nil
}

func (s StubBackend) Vote(box string, session string, timestamp int64, vote int) error {
	return nil
}
