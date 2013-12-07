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

        public UploadPhotoResult Post(TideTrackerInputModel inputModel)
        {
            var flickrId = Guid.NewGuid();
            var photoPath = Path.Combine(@"G:\Photos", flickrId + ".jpg");

            using (var stream = File.Open(photoPath, FileMode.CreateNew, FileAccess.Write))
            {
                stream.Write(inputModel.Photo, 0, inputModel.Photo.Length);
            }

            using (var textStream = File.CreateText(Path.Combine(@"G:\Photos", flickrId + ".json")))
            {
                textStream.Write(Newtonsoft.Json.JsonConvert.SerializeObject(inputModel, Newtonsoft.Json.Formatting.Indented));
            }

            var result = new UploadPhotoResult
            {
                Latitude = inputModel.Latitude,
                Longitude = inputModel.Longitude,
                FlickrId = flickrId.ToString()
            };

            return result;
        }
    }
}
