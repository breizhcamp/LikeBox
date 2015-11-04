package server
import (
	"net/http"
	"strings"
	"encoding/json"
	"os"
	auth "github.com/abbot/go-http-auth"
)

type Status struct {
	Timestamp int64
	Schedule_mtime int64
}

func GetStatus(w http.ResponseWriter, r *auth.AuthenticatedRequest) {
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) != 3 {
		http.Error(w, "Bad Request, expected /satus/boxID", http.StatusBadRequest)
		return
	}
	box := parts[2]
	println("status for box", box)

	status, err := getStatus(box)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
	bytes, _ := json.Marshal(status)
	w.Header().Add("Content-Type", "application/json")
	w.Write(bytes)
}

func getStatus(box string) (Status, error) {

	last := int64(123)
	// 'SELECT max(timestamp) as last_timestamp FROM votes WHERE boitierId='" + box + "''

	mtime, err := os.Stat("schedule.json")
	if err != nil {
		return Status{}, err
	}
	return Status{
		Timestamp: last,
		Schedule_mtime: mtime.ModTime().Unix(),
	}, nil
}