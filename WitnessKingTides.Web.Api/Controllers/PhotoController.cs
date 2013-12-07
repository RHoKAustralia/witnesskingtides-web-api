using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using WitnessKingTides.Web.Api.Models;

namespace WitnessKingTides.Web.Api.Controllers
{
    public class PhotoController : ApiController
    {
        static readonly string ServerUploadFolder = Path.GetTempPath();

        public string Get()
        {
            return "Hello world";
        }

        public async Task<UploadPhotoResult> Post()
        {
            // Verify that this is an HTML Form file upload request
            if (!Request.Content.IsMimeMultipartContent("form-data"))
            {
                throw new HttpResponseException(Request.CreateResponse(HttpStatusCode.UnsupportedMediaType));
            }

            // Create a stream provider for setting up output streams
            MultipartFormDataStreamProvider streamProvider = new MultipartFormDataStreamProvider(ServerUploadFolder);

            // Read the MIME multipart asynchronously content using the stream provider we just created.
            await Request.Content.ReadAsMultipartAsync(streamProvider);

            var result = new UploadPhotoResult
            {
                FileName = streamProvider.FileData.Select(file => file.LocalFileName).FirstOrDefault(),
                Latitude = 0,
                Longitude = 0
            };

            return result;
        }
    }
}
