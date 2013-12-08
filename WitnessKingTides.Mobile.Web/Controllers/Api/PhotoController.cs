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
using WitnessKingTides.Mobile.Web.Models;
using WitnessKingTides.Mobile.Web.Services;

namespace WitnessKingTides.Mobile.Web.Api.Controllers
{
    public class PhotoController : ApiController
    {
        private FlickrService _flickrService;

        public PhotoController()
        {
            _flickrService = new FlickrService();
        }

        public string Get()
        {
            return "Green Cross Australia Witness King Tides";
        }

        public UploadPhotoResult Post(WitnessKingTidesApiInputModel inputModel)
        {
            var result = new UploadPhotoResult
            {
                Latitude = inputModel.Latitude,
                Longitude = inputModel.Longitude
            };

            result.FlickrId = _flickrService.Upload(inputModel);

            return result;
        }
    }
}
