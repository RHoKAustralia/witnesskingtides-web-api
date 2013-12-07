using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.IO;

namespace WitenessKingTides.Web.Api.Controllers
{
    public class PhotoController : ApiController
    {
        static readonly string ServerUploadFolder = Path.GetTempPath();

        public void Post()
        {
            if (!Request.Content.IsMimeMultipartContent("form-data"))
            {
                throw new HttpResponseException(Request.CreateResponse(HttpStatusCode.UnsupportedMediaType));
            }

            MultipartFileStreamProvider streamProvider = new MultipartFileStreamProvider(ServerUploadFolder);
            Request.Content.ReadAsMultipartAsync(streamProvider);

            string firstname = streamProvider.FormData["firstname"];
            string lastname = streamProvider.FormData["lastdata"];
            
        }
    }
}