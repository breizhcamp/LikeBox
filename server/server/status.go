package server
import (
	"net/http"
	"os"
	"github.com/drone/routes"
)

type Status struct {
	Timestamp int64
	Schedule_mtime int64
}

func GetStatus(w http.ResponseWriter, r *http.Request) {
	params := r.URL.Query()
	box := params.Get(":id")
	println("status for box", box)

	status, err := getStatus(box)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
	routes.ServeJson(w, &status)
}

func getStatus(box string) (Status, error) {


	timestamp := 1234

	mtime, err := os.Stat("schedule.json")
	if err != nil {
		return Status{}, err
	}
	return Status{
		Timestamp: int64(timestamp),
		Schedule_mtime: mtime.ModTime().Unix(),
	}, nil
}