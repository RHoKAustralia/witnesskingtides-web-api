using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using WitnessKingTides.Web.Api.Models;
using System.Configuration;
using FlickrNet;

namespace WitnessKingTides.Web.Api.Controllers
{
    public class PhotoController : ApiController
    {
        static readonly string FlickrApiKey;
        static readonly string FlickrApiSecret;

        static PhotoController()
        {
            FlickrApiKey = ConfigurationManager.AppSettings["Flickr-Key"];
            FlickrApiSecret = ConfigurationManager.AppSettings["Flickr-Secret"];
        }

        public string Get()
        {
            return "Green Cross Australia Witness King Tides";
        }

        public UploadPhotoResult Post(TideTrackerInputModel inputModel)
        {
            var fileId = Guid.NewGuid();
            inputModel.FileName = fileId + ".jpg";
            var photoPath = Path.Combine(@"G:\Photos", inputModel.FileName);

            using (var stream = File.Open(photoPath, FileMode.CreateNew, FileAccess.Write))
            {
                stream.Write(inputModel.Photo, 0, inputModel.Photo.Length);
            }

            using (var textStream = File.CreateText(Path.Combine(@"G:\Photos", fileId + ".json")))
            {
                textStream.Write(Newtonsoft.Json.JsonConvert.SerializeObject(inputModel, Newtonsoft.Json.Formatting.Indented));
            }

            var result = new UploadPhotoResult
            {
                Latitude = inputModel.Latitude,
                Longitude = inputModel.Longitude
            };

            result.FlickrId = UploadToFlickr(inputModel);

            return result;
        }

        private string UploadToFlickr(TideTrackerInputModel model)
        {
            string flickrId = string.Empty;

            var flickr = new Flickr(FlickrApiKey, FlickrApiSecret);

            var auth = flickr.AuthOAuthGetAccessToken();

            using (var memoryStream = new MemoryStream())
            {
                memoryStream.Write(model.Photo, 0, model.Photo.Length);

                flickrId = flickr.UploadPicture(memoryStream, model.FileName, null, model.Description, null, true, true, true, ContentType.Photo, SafetyLevel.None, HiddenFromSearch.Visible);
            }

            return flickrId;
        }
    }
}
