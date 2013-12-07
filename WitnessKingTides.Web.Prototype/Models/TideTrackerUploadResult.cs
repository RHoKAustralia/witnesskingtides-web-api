using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WitnessKingTides.Web.Prototype.Models
{
    public class TideTrackerUploadResult
    {
        public string FlickrId { get; set; }

        public decimal Latitude { get; set; }

        public decimal Longitude { get; set; }
    }
}