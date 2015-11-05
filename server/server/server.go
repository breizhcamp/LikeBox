package server
import (
	"github.com/drone/routes"
	"net/http"
	"encoding/base64"
	"bytes"
	"strings"
)

func unauthorized(w http.ResponseWriter) {
	w.Header().Set("WWW-Authenticate", `Basic realm=likebox.io`)
	http.Error(w, "Unauthorized", http.StatusUnauthorized)
}

const basicAuthPrefix string = "Basic "

func CreateAPIServer() *routes.RouteMux {

	server := routes.New()
	server.Get("/status/:id", GetStatus)
	server.Post("/vote/:id", Vote)
	server.FilterParam("id", func(w http.ResponseWriter, r *http.Request) {
		auth := r.Header.Get("Authorization")
		if strings.HasPrefix(auth, basicAuthPrefix) {
			payload, err := base64.StdEncoding.DecodeString(auth[len(basicAuthPrefix):])
			if err == nil {
				pair := bytes.SplitN(payload, []byte(":"), 2)
				if len(pair) == 2 &&
				bytes.Equal(pair[0], []byte("bzhcamp")) &&
				bytes.Equal(pair[1], []byte("CHANGEME")) {
					return
				}
			}
		}
		unauthorized(w)
	})
	server.Static("/static", "static")
	return server
}
