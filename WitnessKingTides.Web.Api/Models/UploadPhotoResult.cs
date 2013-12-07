using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WitnessKingTides.Web.Api.Models
{
    public class UploadPhotoResult
    {
        public string FileName { get; set; }

        public decimal Latitude { get; set; }

        public decimal Longitude { get; set; }

        public string FlickrId { get; set; }
    }
}