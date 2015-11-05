package server
import (
	"github.com/drone/routes"
	"net/http"
)

func unauthorized(w http.ResponseWriter) {
	w.Header().Set("WWW-Authenticate", `Basic realm=likebox.io`)
	http.Error(w, "Unauthorized", http.StatusUnauthorized)
}

type Backend interface {
	GetStatus(box string) (Status, error)
	Vote(box string, session string, timestamp int64, vote int) error
}

type ApiHandlerFunc func(Backend, http.ResponseWriter, *http.Request)

func wrap(b *Backend, f ApiHandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		f(*b, w, r)
	}
}


func NewAPIServer(backend Backend) *routes.RouteMux {

	server := routes.New()

	server.Get("/status/:id", wrap(&backend, GetStatus))
	server.Post("/vote/:id", wrap(&backend, Vote))
	server.FilterParam("id", func(w http.ResponseWriter, r *http.Request) {
		user, pass, ok := r.BasicAuth()
		if ok && user == "bzhcamp" && pass == "CHANGEME" {
			return
		}
		unauthorized(w)
	})
	server.Static("/static", "static")
	return server
}
