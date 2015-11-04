package server
import (
	"net/http"
	auth "github.com/abbot/go-http-auth"
)

func Secret(user, realm string) string {
	if user == "bzhcamp" {
		// encrypted password with salt :
		// string(auth.MD5Crypt([]byte("CHANGEME"), []byte("azerty"), []byte("$1$")))
		return "$1$azerty$zUCR/Z0FcipxnOptjQs6t/"
	}
	return ""
}

func CreateAPIServer() *http.ServeMux {
	authenticator := auth.NewBasicAuthenticator("backend.likebox.io", Secret)
	server := http.NewServeMux()
	server.HandleFunc("/status/", authenticator.Wrap(GetStatus))
	server.HandleFunc("/vote/", authenticator.Wrap(Vote))
	return server
}
