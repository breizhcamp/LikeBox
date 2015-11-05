package server
import (
	"net/http"
)



func Vote(_ Backend, w http.ResponseWriter, r *http.Request) {

	params := r.URL.Query()
	box := params.Get(":id")
	println("recieve votes from box", box)
	w.WriteHeader(http.StatusCreated)
}

