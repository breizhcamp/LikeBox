package server
import (
	"net/http"
	"strings"
	auth "github.com/abbot/go-http-auth"
)



func Vote(w http.ResponseWriter, r *auth.AuthenticatedRequest) {
	if r.Method != "post" {
		http.Error(w, "POST required", http.StatusMethodNotAllowed)
	}
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) != 3 {
		http.Error(w, "Bad Request, expected /satus/boxID", http.StatusBadRequest)
		return
	}
	box := parts[2]
	println("recieve votes from box", box)
	w.WriteHeader(http.StatusCreated)
}

