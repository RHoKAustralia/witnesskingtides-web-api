using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WitnessKingTides.Mobile.Web.Models
{
    public class UploadPhotoResult
    {
        public string FlickrId { get; set; }

        public decimal Latitude { get; set; }

        public decimal Longitude { get; set; }
    }
}