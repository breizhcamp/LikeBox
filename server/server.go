package main
import (
	"github.com/breizhcamp/LikeBox/server/server"
	"net/http"
)


func main() {
	apiServer := server.NewAPIServer()
	http.ListenAndServe(":8000", apiServer)
}
